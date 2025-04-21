require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const kafka = require('kafka-node');
const ProductOffering = require('./models/ProductOffering');

const app = express();
app.use(bodyParser.json());

// Connexion MongoDB
mongoose.connect(
  'mongodb+srv://ikramelhayani1999:a17PG84TFRVDFSLB@cluster0.vcjxyqf.mongodb.net/ordermanagement_db?retryWrites=true&w=majority&appName=Cluster0',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
);

// Connexion Kafka
const client = new kafka.KafkaClient({ kafkaHost: process.env.KAFKA_BROKER });
const producer = new kafka.Producer(client);

producer.on('ready', () => {
  console.log('✅ Kafka Producer is connected and ready.');
});

producer.on('error', (err) => {
  console.error('❌ Kafka Producer error:', err);
});

// Endpoint pour recevoir l'offre produit
app.post('/send-offering', async (req, res) => {
  const offering = req.body;

  console.log('📦 Données reçues de ServiceNow :', offering);

  // Enregistrer dans MongoDB
  try {
    const newOffering = new ProductOffering(offering);
    await newOffering.save();
    console.log('✅ Offre produit enregistrée dans MongoDB');
  } catch (err) {
    console.error('❌ Erreur MongoDB :', err);
    return res.status(500).json({ error: 'Erreur MongoDB' });
  }

  // Envoyer à Kafka
  const payloads = [
    {
      topic: process.env.KAFKA_TOPIC,
      messages: JSON.stringify(offering),
    },
  ];

  producer.send(payloads, (err, data) => {
    if (err) {
      console.error('❌ Erreur envoi Kafka :', err);
      return res.status(500).json({ error: 'Erreur Kafka' });
    }
    console.log('📨 Message envoyé à Kafka avec succès :', data);
    res.status(200).json({ message: 'Offre envoyée à Kafka et MongoDB', data });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API listening on port ${PORT}`);
});
