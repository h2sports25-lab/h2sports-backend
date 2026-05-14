import express from "express";
import cors from "cors";
import pkg from "mercadopago";

const { MercadoPagoConfig, Payment } = pkg;

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

const client = new MercadoPagoConfig({
  accessToken: "APP_USR-5416772088524473-042915-734b5835dffc44c01a9fcb044b1d05b8-3320971428"
});

// rota teste
app.get("/", (req, res) => {
  res.send("API funcionando 🚀");
});

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

    let paymentData = {
      transaction_amount: Number(transaction_amount),

      description: "Compra H2Sports",

      payment_method_id,

      notification_url:
        "https://h2sports-backend-1.onrender.com/webhook",

      payer: {
        email: payer.email || "cliente@email.com"
      }
    };

    // CARTÃO
    if (payment_method_id !== "pix") {

      paymentData.token = token;

      paymentData.installments =
        Number(installments);

      paymentData.payer.identification =
        payer.identification;
    }

    const payment = new Payment(client);

    const response = await payment.create({
      body: paymentData
    });

    console.log(
      "RESPOSTA:",
      JSON.stringify(response, null, 2)
    );

    if (payment_method_id === "pix") {

      return res.json({
        status: response.status,

        qr_code:
          response.point_of_interaction
            ?.transaction_data?.qr_code,

        qr_code_base64:
          response.point_of_interaction
            ?.transaction_data?.qr_code_base64
      });
    }

  
    res.json({
      status: response.status,
      status_detail: response.status_detail
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Erro ao processar pagamento"
    });
  }
});
app.all("/webhook", (req, res) => {

  console.log("🔔 Webhook recebido:");
  console.log("METHOD:", req.method);
  console.log(JSON.stringify(req.body, null, 2));

  res.sendStatus(200);

});

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT} 🚀`);
});