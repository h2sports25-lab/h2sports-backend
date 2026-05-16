import admin from "firebase-admin";

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

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
      process.env.MP_ACCESS_TOKEN
  });

const payment =
  new Payment(client);

/*
========================================
ROTA TESTE
========================================
*/

app.get("/", (req, res) => {
  res.send("API funcionando 🚀");
});

/*
========================================
CRIAR PAGAMENTO
========================================
*/

app.post(
  "/process_payment",
  async (req, res) => {

    console.log(
      "BODY RECEBIDO:",
      req.body
    );

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
            Number(
              transaction_amount
            ).toFixed(2)
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

      /*
      ========================================
      CARTÃO
      ========================================
      */

      if (
        payment_method_id !== "pix" &&
        payment_method_id !== "account_money"
      ) {

        paymentData.token = token;

        paymentData.installments =
          Number(installments);

        if (
          payer?.identification
        ) {

          paymentData.payer.identification =
            payer.identification;
        }
      }

      console.log(
        "VALOR FINAL:",
        paymentData.transaction_amount
      );

      /*
      ========================================
      CRIAR PAGAMENTO MP
      ========================================
      */

      const paymentResult =
        await payment.create({
          body: paymentData
        });

      console.log(
        "===== RESPOSTA MP ====="
      );

      console.log(
        JSON.stringify(
          paymentResult,
          null,
          2
        )
      );

      console.log(
        "======================="
      );

      /*
      ========================================
      PIX
      ========================================
      */

      if (
        payment_method_id === "pix"
      ) {

        await db
          .collection("orders")
          .add({

            paymentId:
              paymentResult.id,

            status:
              "pending",

            paymentMethod:
              payment_method_id,

            customerEmail:
              payer?.email || "",

            total:
              Number(
                transaction_amount
              ),

            createdAt:
              new Date(),

            items:
              req.body.items || []
          });

        return res.json({

          paymentId:
            paymentResult.id,

          status:
            paymentResult.status,

          payment_method_id:
            paymentResult.payment_method_id,

          qr_code:
            paymentResult
              .point_of_interaction
              ?.transaction_data
              ?.qr_code,

          qr_code_base64:
            paymentResult
              .point_of_interaction
              ?.transaction_data
              ?.qr_code_base64
        });
      }

      /*
      ========================================
      CARTÃO
      ========================================
      */

      return res.json({

        paymentId:
          paymentResult.id,

        status:
          paymentResult.status,

        status_detail:
          paymentResult
            .status_detail
      });

    } catch (error) {

      console.error(
        "ERRO MP:"
      );

      console.error(error);

      return res.status(500).json({

        error:
          "Erro ao processar pagamento",

        details:
          error.message,

        cause:
          error.cause || null
      });
    }
  }
);

/*
========================================
VERIFICAR PAGAMENTO
========================================
*/

app.get(
  "/check-payment/:paymentId",
  async (req, res) => {

    try {

      const paymentId =
        Number(
          req.params.paymentId
        );

      const snapshot =
        await db
          .collection("orders")
          .where(
            "paymentId",
            "==",
            paymentId
          )
          .get();

      if (
        snapshot.empty
      ) {

        return res.json({
          status:
            "not_found"
        });
      }

      const order =
        snapshot.docs[0].data();

      return res.json({

        status:
          order.status
      });

    } catch (error) {

      console.error(error);

      return res.status(500).json({

        error:
          "Erro ao verificar pagamento"
      });
    }
  }
);

/*
========================================
WEBHOOK
========================================
*/

app.post(
  "/webhook",
  async (req, res) => {

    try {

      console.log(
        "WEBHOOK RECEBIDO:"
      );

      console.log(
        JSON.stringify(
          req.body,
          null,
          2
        )
      );

      const paymentId =
        req.body?.data?.id;

      const type =
        req.body?.type;

      if (
        !paymentId ||
        type !== "payment"
      ) {

        return res.sendStatus(200);
      }

      const paymentInfo =
        await payment.get({
          id: paymentId
        });

      console.log(
        "STATUS REAL:",
        paymentInfo.status
      );

      if (
        paymentInfo.status ===
        "approved"
      ) {

        const snapshot =
          await db
            .collection("orders")
            .where(
              "paymentId",
              "==",
              Number(paymentId)
            )
            .get();

        for (const doc of snapshot.docs) {

          await doc.ref.update({

            status:
              "approved",

            approvedAt:
              new Date()
          });
        }

        console.log(
          "✅ PEDIDO APROVADO"
        );
      }

      return res.sendStatus(200);

    } catch (error) {

      console.error(error);

      return res.sendStatus(500);
    }
  }
);

/*
========================================
INICIAR SERVIDOR
========================================
*/

const PORT =
  process.env.PORT || 3333;

app.listen(PORT, () => {

  console.log(
    `Servidor rodando na porta ${PORT} 🚀`
  );
});