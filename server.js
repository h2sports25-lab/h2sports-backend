import express from "express";
import cors from "cors";
import pkg from "mercadopago";

const { MercadoPagoConfig, Payment } = pkg;

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

// 🔐 Config
const client = new MercadoPagoConfig({
  accessToken: "APP_USR-5416772088524473-042915-734b5835dffc44c01a9fcb044b1d05b8-3320971428"
});

// rota teste
app.get("/", (req, res) => {
  res.send("API funcionando 🚀");
});

// 🔥 pagamento
app.post("/process_payment", async (req, res) => {
console.log("BODY RECEBIDO:", req.body);
  try {
    const {
      token,
      transaction_amount,
      installments,
      payment_method_id,
      payer
    } = req.body;

    const paymentData = {
      transaction_amount: Number(transaction_amount),
      token: token,
      description: "Compra H2Sports",
      installments: Number(installments),
      payment_method_id: payment_method_id,

      notification_url:
  "https://h2sports-backend-1.onrender.com/webhook",

      payer: {
        email: payer.email || "test_user_123456@testuser.com",
        identification: payer.identification
      }
    };

    
    const payment = new Payment(client);

    const response = await payment.create({ body: paymentData });

console.log("STATUS:", response.status);
console.log("DETAIL:", response.status_detail);
console.log("RESPOSTA COMPLETA:", JSON.stringify(response, null, 2));

res.json(response);

  } catch (error) {
  console.error("❌ ERRO MP COMPLETO:");

  if (error.cause) {
    console.log("CAUSE:", JSON.stringify(error.cause, null, 2));
  }

  if (error.response) {
    console.log("RESPONSE:", JSON.stringify(error.response, null, 2));
  }

  console.log("ERROR RAW:", error);

  res.status(500).json({
    error: "Erro ao processar pagamento",
    detalhe: error.message || error
  });
}
});

app.get("/webhook", (req, res) => {
  res.send("Webhook ativo");
});

app.post("/webhook", async (req, res) => {

  console.log("🔔 Webhook recebido:");
  console.log(JSON.stringify(req.body, null, 2));

  res.sendStatus(200);

});

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT} 🚀`);
});