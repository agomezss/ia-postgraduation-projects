import tf from "@tensorflow/tfjs-node";

// Criamos um modelo de rede neural para classificar pessoas em categorias (premium, medium, basic) com base em características como idade, cor e localização.
// O modelo é treinado usando um conjunto de dados de exemplo e depois faz previsões para uma nova pessoa.

async function trainModel(inputXs, outputYs) {
  // Criamos um modelo sequencial simples
  const model = tf.sequential();

  // Primeira camada da rede:
  // entrada de 7 posições (idade normalizada + 3 cores + 3 localizações)
  // 80 neuronioes = pouca base de treino, quanto mais neurionios, mais capacidade de aprender, mas também mais propenso a overfitting
  // ativação ReLU para introduzir não linearidade (se for negativo, já descarta, se for positivo, mantém o valor)
  model.add(
    tf.layers.dense({ inputShape: [7], units: 80, activation: "relu" }),
  );

  // Saída: 3 neurônios (um para cada categoria: premium, medium, basic)
  // ativação softmax para normalizar a saída em probabilidades
  model.add(tf.layers.dense({ units: 3, activation: "softmax" }));

  // Compilando o modelo
  // otimizador Adam (Adaptive Moment Estimation) é um treinador pessoal moderno para redes neurais, ajusta os pesos de forma eficiente e inteligente, aprendendo com histórico de erros e acertos
  // loss: categoricalCrossentropy compara o que o modelo "acha" (os scores de cada categoria) com a resposta certa, quanto mais distante da previsão do modelo da resposta correta, maior o erro (loss)
  // exemplo classico de uso: classificação de imagens, recomendação, categorização de usuário
  model.compile({
    optimizer: "adam",
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  });

  // Treinamento do modelo
  // verbose: desabilita o log interno (e usa só callback)
  // epochs: quantidade de vezes que vai rodar no dataset
  // shuffle: embaralha os dados, para evitar viés / BIAS
  await model.fit(inputXs, outputYs, {
    verbose: 0,
    epochs: 100,
    shuffle: true,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        // console.log(
        //   `Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`,
        // );
      },
    },
  });

  return model;
}

async function predict(model, pessoa) {
  // transformar o array js para o tensor (tfjs)
  const tfInput = tf.tensor2d(pessoa);
  // Faz a predição (output será um vetor de 3 probabilidades)
  const pred = model.predict(tfInput);
  const predArray = await pred.array();
  return predArray[0].map((prob, index) => ({ prob, index }));
}

// Exemplo de pessoas para treino (cada pessoa com idade, cor e localização)
// const pessoas = [
//     { nome: "Erick", idade: 30, cor: "azul", localizacao: "São Paulo" },
//     { nome: "Ana", idade: 25, cor: "vermelho", localizacao: "Rio" },
//     { nome: "Carlos", idade: 40, cor: "verde", localizacao: "Curitiba" }
// ];

// Vetores de entrada com valores já normalizados e one-hot encoded
// Ordem: [idade_normalizada, azul, vermelho, verde, São Paulo, Rio, Curitiba]
// const tensorPessoas = [
//     [0.33, 1, 0, 0, 1, 0, 0], // Erick
//     [0, 0, 1, 0, 0, 1, 0],    // Ana
//     [1, 0, 0, 1, 0, 0, 1]     // Carlos
// ]

// Usamos apenas os dados numéricos, como a rede neural só entende números.
// tensorPessoasNormalizado corresponde ao dataset de entrada do modelo.
const tensorPessoasNormalizado = [
  [0.33, 1, 0, 0, 1, 0, 0], // Erick
  [0, 0, 1, 0, 0, 1, 0], // Ana
  [1, 0, 0, 1, 0, 0, 1], // Carlos
];

// Labels das categorias a serem previstas (one-hot encoded)
// [premium, medium, basic]
const labelsNomes = ["premium", "medium", "basic"]; // Ordem dos labels
const tensorLabels = [
  [1, 0, 0], // premium - Erick
  [0, 1, 0], // medium - Ana
  [0, 0, 1], // basic - Carlos
];

// Criamos tensores de entrada (xs) e saída (ys) para treinar o modelo
const inputXs = tf.tensor2d(tensorPessoasNormalizado);
const outputYs = tf.tensor2d(tensorLabels);

// Depois daqui, é comum salvar o modelo em disco, ou no browser pra não ter que fazer o training toda hora que executar
const model = await trainModel(inputXs, outputYs);

const pessoa = { nome: "zé", idade: 28, cor: "verde", localizacao: "Curitiba" };
// Normalizando a idade
// Exemplo: idade_min = 25, idade_max = 40, então ((28-25)/(40 - 25)) = 0.2
const pessoaTensorNormalizado = [
  [
    0.2, // idade normalizada
    0, // azul
    0, // vermelho
    1, // verde
    0, // sao paulo
    0, // rio
    1, //curitiba
  ],
];

const predictions = await predict(model, pessoaTensorNormalizado);
const results = predictions
  .sort((a, b) => b.prob - a.prob)
  .map((p) => `${labelsNomes[p.index]} (${(p.prob * 100).toFixed(2)}%)`)
  .join("\n");

console.log(results);
