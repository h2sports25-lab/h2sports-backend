import express from "express";
import cors from "cors";
import { MercadoPagoConfig, Preference } from "mercadopago";

const app = express();

app.use(cors());
app.use(express.json());

const client = new MercadoPagoConfig({
  accessToken: "APP_USR-8465927762797185-040710-ec5e0d6f90572862472bf41950656764-3319444395"
});

app.post("/criar-pagamento-mp", async (req, res) => {
  try {
    const items = req.body.items;

    const mpItems = items.map(item => ({
      title: item.title,
      unit_price: Number(item.price),
      quantity: 1
    }));

    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: mpItems
      }
    });

    res.json({
      url: response.init_point
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar pagamento" });
  }
});

app.get("/", (req, res) => {
  res.send("Servidor rodando 🚀");
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});