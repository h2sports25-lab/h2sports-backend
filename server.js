import express from "express";
import cors from "cors";

import {
  MercadoPagoConfig,
  Payment
} from "mercadopago";

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

const client =
  new MercadoPagoConfig({

    accessToken:
      "APP_USR-5416772088524473-042915-734b5835dffc44c01a9fcb044b1d05b8-3320971428"
  });

const payment =
  new Payment(client);
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

      transaction_amount:
  parseFloat(
    Number(transaction_amount).toFixed(2)
  ),

      description:
        "Compra H2Sports",

      payment_method_id,

      notification_url:
        "https://h2sports-backend-1.onrender.com/webhook",

      external_reference:
        `H2-${Date.now()}`,

      payer: {
        email:
          payer?.email ||
          "cliente@email.com"
      }
    };

    // CARTÃO
    if (
      payment_method_id !== "pix" &&
      payment_method_id !== "account_money"
    ) {

      paymentData.token = token;

      paymentData.installments =
        Number(installments);

      if (payer?.identification) {

        paymentData.payer.identification =
          payer.identification;
      }
    }

    console.log(
  "VALOR FINAL:",
  paymentData.transaction_amount
);

    const response =
      await payment.create({
        body: paymentData
      });

    console.log("===== RESPOSTA MP =====");
console.log(JSON.stringify(response, null, 2));
console.log("=======================");

    // PIX
if (payment_method_id === "pix") {

  return res.json({

    status:
      response.status,

    payment_method_id:
      response.payment_method_id,

    qr_code:
      response
        .point_of_interaction
        ?.transaction_data
        ?.qr_code,

    qr_code_base64:
      response
        .point_of_interaction
        ?.transaction_data
        ?.qr_code_base64
  });
}

    // CARTÃO
    return res.json({

      status:
        response.status,

      status_detail:
        response.status_detail
    });

  } catch (error) {

    console.error("ERRO MP:");
    console.error(error);

    return res.status(500).json({
      error: "Erro ao processar pagamento",
      details: error.message,
      cause: error.cause || null
    });
  }
});

// WEBHOOK
app.post("/webhook", async (req, res) => {

  try {

    console.log("🔔 WEBHOOK:");
    console.log(JSON.stringify(req.body, null, 2));

    const paymentId =
      req.body?.data?.id;

    if (!paymentId) {
      return res.sendStatus(200);
    }

    // BUSCA PAGAMENTO
    const paymentInfo =
      await payment.get({
        id: paymentId
      });

    console.log(
      "PAGAMENTO:",
      JSON.stringify(paymentInfo, null, 2)
    );

    // PIX PAGO
    if (paymentInfo.status === "approved") {

      console.log("✅ PIX APROVADO");

      /*
        AQUI você salva o pedido no banco
        Firebase / Mongo / Supabase etc
      */

    }

    return res.sendStatus(200);

  } catch (error) {

    console.error(error);

    return res.sendStatus(500);
  }
});

const PORT =
  process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(
    `Servidor rodando na porta ${PORT} 🚀`
  );
});