import "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js";
import { workerEvents } from "../events/constants.js";
let _globalCtx = {};
let _model = null;

const PERSISTENCE = {
  modelKey: "indexeddb://aleia-game-recommender-model",
  dbName: "aleia-game-recommender-db",
  storeName: "worker-state",
  contextKey: "model-context-v1",
};

const WEIGHTS = {
  category: 0.6,
  metacritic: 0.3,
  age: 0.1,
};

// 🔢 Normalize continuous values to 0–1 range
// Why? Keeps all features balanced so no one dominates training
// Formula: (val - min) / (max - min)
// Example: price=129.99, minPrice=39.99, maxPrice=199.99 → 0.56
const normalize = (value, min, max) => (value - min) / (max - min || 1);

function openStateDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(PERSISTENCE.dbName, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PERSISTENCE.storeName)) {
        db.createObjectStore(PERSISTENCE.storeName);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveContextToIndexedDb(context) {
  const db = await openStateDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(PERSISTENCE.storeName, "readwrite");
    const store = tx.objectStore(PERSISTENCE.storeName);
    store.put(context, PERSISTENCE.contextKey);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function loadContextFromIndexedDb() {
  const db = await openStateDb();
  const context = await new Promise((resolve, reject) => {
    const tx = db.transaction(PERSISTENCE.storeName, "readonly");
    const store = tx.objectStore(PERSISTENCE.storeName);
    const request = store.get(PERSISTENCE.contextKey);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return context;
}

function serializeContext(context) {
  return {
    categoriesIndex: context.categoriesIndex,
    gameAvgAgeNorm: context.gameAvgAgeNorm,
    minAge: context.minAge,
    maxAge: context.maxAge,
    minMetacritic: context.minMetacritic,
    maxMetacritic: context.maxMetacritic,
    numCategories: context.numCategories,
    dimensions: context.dimensions,
    gameVectors: context.gameVectors.map((game) => ({
      ...game,
      vector: Array.from(game.vector),
    })),
  };
}

function deserializeContext(serializedContext) {
  if (!serializedContext) return null;

  return {
    categoriesIndex: serializedContext.categoriesIndex,
    gameAvgAgeNorm: serializedContext.gameAvgAgeNorm,
    minAge: serializedContext.minAge,
    maxAge: serializedContext.maxAge,
    minMetacritic: serializedContext.minMetacritic,
    maxMetacritic: serializedContext.maxMetacritic,
    numCategories: serializedContext.numCategories,
    dimensions: serializedContext.dimensions,
    gameVectors: serializedContext.gameVectors || [],
  };
}

async function persistTrainingState(model, context) {
  await Promise.all([
    model.save(PERSISTENCE.modelKey),
    saveContextToIndexedDb(serializeContext(context)),
  ]);
}

async function ensureLoadedModelAndContext() {
  if (_model && _globalCtx?.gameVectors?.length) {
    return true;
  }

  try {
    const [model, serializedContext] = await Promise.all([
      tf.loadLayersModel(PERSISTENCE.modelKey),
      loadContextFromIndexedDb(),
    ]);

    if (!model || !serializedContext) return false;

    _model = model;
    _globalCtx = deserializeContext(serializedContext);
    return Boolean(_globalCtx?.gameVectors?.length);
  } catch {
    return false;
  }
}

function makeContext(games, users) {
  const ages = users.map((u) => u.age);
  const metacritics = games.map((p) => p.metacritic);

  const minAge = Math.min(...ages);
  const maxAge = Math.max(...ages);

  const minMetacritic = Math.min(...metacritics);
  const maxMetacritic = Math.max(...metacritics);

  const categories = [...new Set(games.map((p) => p.category))]; // Set -> Evita duplicação

  const categoriesIndex = Object.fromEntries(
    categories.map((category, index) => {
      return [category, index];
    }),
  );

  // Computar a média de idade dos comprados por game
  // (ajuda a personalizar)
  const midAge = (minAge + maxAge) / 2;
  const ageSums = {};
  const ageCounts = {};

  users.forEach((user) => {
    user.games.forEach((p) => {
      ageSums[p.name] = (ageSums[p.name] || 0) + user.age;
      ageCounts[p.name] = (ageCounts[p.name] || 0) + 1;
    });
  });

  const gameAvgAgeNorm = Object.fromEntries(
    games.map((game) => {
      const avg = ageCounts[game.name]
        ? ageSums[game.name] / ageCounts[game.name]
        : midAge;

      return [game.name, normalize(avg, minAge, maxAge)];
    }),
  );

  return {
    games: games,
    users,
    categoriesIndex,
    gameAvgAgeNorm: gameAvgAgeNorm,
    minAge,
    maxAge,
    minMetacritic: minMetacritic,
    maxMetacritic: maxMetacritic,
    numCategories: categories.length,
    // metacritic + age + categories
    dimensions: 2 + categories.length,
  };
}

const oneHotWeighted = (index, length, weight) =>
  tf.oneHot(index, length).cast("float32").mul(weight);

function encodeGame(game, context) {
  // normalizando dados para ficar de 0 a 1 e
  // aplicar o peso na recomendação
  const metacritic = tf.tensor1d([
    normalize(game.metacritic, context.minMetacritic, context.maxMetacritic) *
      WEIGHTS.metacritic,
  ]);

  const age = tf.tensor1d([
    (context.gameAvgAgeNorm[game.name] ?? 0.5) * WEIGHTS.age,
  ]);

  const category = oneHotWeighted(
    context.categoriesIndex[game.category],
    context.numCategories,
    WEIGHTS.category,
  );

  return tf.concat1d([metacritic, age, category]);
}

function encodeUser(user, context) {
  if (user.games.length) {
    return tf
      .stack(user.games.map((game) => encodeGame(game, context)))
      .mean(0)
      .reshape([1, context.dimensions]);
  }

  return tf
    .concat1d([
      tf.zeros([1]), // score é ignorado,
      tf.tensor1d([
        normalize(user.age, context.minAge, context.maxAge) * WEIGHTS.age,
      ]), // ages utilizado
      tf.zeros([context.numCategories]), // categoria ignorada,
    ])
    .reshape([1, context.dimensions]);
}

function createTrainingData(context) {
  const inputs = [];
  const labels = [];
  context.users
    .filter((u) => u.games.length)
    .forEach((user) => {
      const userVector = encodeUser(user, context).dataSync();
      context.games.forEach((game) => {
        const gameVector = encodeGame(game, context).dataSync();

        const label = user.games.some(
          (ownedGame) => ownedGame.name === game.name,
        )
          ? 1
          : 0;
        // combinar user + game
        inputs.push([...userVector, ...gameVector]);
        labels.push(label);
      });
    });

  return {
    xs: tf.tensor2d(inputs),
    ys: tf.tensor2d(labels, [labels.length, 1]),
    inputDimension: context.dimensions * 2,
    // tamanho = userVector + gameVector
  };
}

async function configureNeuralNetAndTrain(trainData) {
  const model = tf.sequential();
  // Camada de entrada
  // - inputShape: Número de features por exemplo de treino (trainData.inputDim)
  //   Exemplo: Se o vetor produto + usuário = 20 números, então inputDim = 20
  // - units: 128 neurônios (muitos "olhos" para detectar padrões)
  // - activation: 'relu' (mantém apenas sinais positivos, ajuda a aprender padrões não-lineares)
  model.add(
    tf.layers.dense({
      inputShape: [trainData.inputDimension],
      units: 128,
      activation: "relu",
    }),
  );
  // Camada oculta 1
  // - 64 neurônios (menos que a primeira camada: começa a comprimir informação)
  // - activation: 'relu' (ainda extraindo combinações relevantes de features)
  model.add(
    tf.layers.dense({
      units: 64,
      activation: "relu",
    }),
  );

  // Camada oculta 2
  // - 32 neurônios (mais estreita de novo, destilando as informações mais importantes)
  //   Exemplo: De muitos sinais, mantém apenas os padrões mais fortes
  // - activation: 'relu'
  model.add(
    tf.layers.dense({
      units: 32,
      activation: "relu",
    }),
  );

  // Camada de saída
  // - 1 neurônio porque vamos retornar apenas uma pontuação de recomendação
  // - activation: 'sigmoid' comprime o resultado para o intervalo 0-1
  //   Exemplo: 0.9 = recomendação forte, 0.1 = recomendação fraca
  model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));

  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: "binaryCrossentropy",
    metrics: ["accuracy"],
  });

  await model.fit(trainData.xs, trainData.ys, {
    epochs: 100,
    batchSize: 32,
    shuffle: true,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        postMessage({
          type: workerEvents.trainingLog,
          epoch: epoch,
          loss: logs.loss,
          accuracy: logs.acc,
        });
      },
    },
  });

  return model;
}

async function trainModel({ users }) {
  console.log("Training model with users:", users);
  postMessage({ type: workerEvents.progressUpdate, progress: { progress: 1 } });
  const games = await (await fetch("/data/games.json")).json();

  const context = makeContext(games, users);
  context.gameVectors = games.map((game) => {
    return {
      name: game.name,
      meta: { ...game },
      vector: encodeGame(game, context).dataSync(),
    };
  });

  _globalCtx = context;

  const trainData = createTrainingData(context);
  _model = await configureNeuralNetAndTrain(trainData);
  await persistTrainingState(_model, context);

  postMessage({
    type: workerEvents.progressUpdate,
    progress: { progress: 100 },
  });
  postMessage({ type: workerEvents.trainingComplete });
}

function getRecommendationReason(user, game, context) {
  const userCategories = new Set(
    user.games.map((ownedGame) => ownedGame.category),
  );
  const sameCategory = userCategories.has(game.category);

  const userAgeNorm = normalize(user.age, context.minAge, context.maxAge);
  const gameAgeNorm = context.gameAvgAgeNorm[game.name] ?? 0.5;
  const ageDistance = Math.abs(userAgeNorm - gameAgeNorm);
  const ageMatch = ageDistance <= 0.2;

  const highMetacritic =
    normalize(game.metacritic, context.minMetacritic, context.maxMetacritic) >=
    0.75;

  if (sameCategory && ageMatch) {
    return "Categoria alinhada ao seu histórico e perfil de idade parecido.";
  }

  if (sameCategory && highMetacritic) {
    return "Categoria que você costuma jogar com metacritic acima da média.";
  }

  if (ageMatch) {
    return "Boa aderência ao perfil de idade de quem joga este título.";
  }

  if (highMetacritic) {
    return "Título com metacritic alto e boa chance de agradar.";
  }

  return "Pontuação do modelo indica potencial de interesse para você.";
}

async function recommend({ user }) {
  const loaded = await ensureLoadedModelAndContext();
  if (!loaded) return;

  const context = _globalCtx;
  // 1️⃣ Converta o usuário fornecido no vetor de features codificadas
  //    Isso transforma as informações do usuário no mesmo formato numérico
  //    que foi usado para treinar o modelo.

  const userVector = encodeUser(user, context).dataSync();

  const inputs = context.gameVectors.map(({ vector }) => {
    return [...userVector, ...vector];
  });

  // 3️⃣ Converta todos esses pares (usuário, produto) em um único Tensor.
  //    Formato: [numProdutos, inputDim]
  const inputTensor = tf.tensor2d(inputs);

  // 4️⃣ Rode a rede neural treinada em todos os pares (usuário, produto) de uma vez.
  //    O resultado é uma pontuação para cada produto entre 0 e 1.
  //    Quanto maior, maior a probabilidade do usuário querer aquele produto.
  const predictions = _model.predict(inputTensor);

  // 5️⃣ Extraia as pontuações para um array JS normal.
  const scores = predictions.dataSync();
  const recommendations = context.gameVectors.map((item, index) => {
    return {
      ...item.meta,
      name: item.name,
      score: scores[index], // previsão do modelo para este game
      reason: getRecommendationReason(user, item.meta, context),
    };
  });

  const sortedItems = recommendations.sort((a, b) => b.score - a.score);

  // 8️⃣ Envie a lista ordenada de produtos recomendados
  //    para a thread principal (a UI pode exibi-los agora).
  postMessage({
    type: workerEvents.recommend,
    user,
    recommendations: sortedItems,
  });
}

const handlers = {
  [workerEvents.trainModel]: trainModel,
  [workerEvents.recommend]: recommend,
};

self.onmessage = (e) => {
  const { action, ...data } = e.data;
  if (handlers[action]) handlers[action](data);
};
