require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const kafka = require('kafka-node');
const ProductOffering = require('./models/ProductOffering');
const ProductSpecification = require('./models/ProductSpecification'); // ✅ Nouveau modèle ajouté



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

// Route : Product Specification ✅ NOUVELLE ROUTE
app.post('/send-specification', async (req, res) => {
  const specification = req.body;

  console.log('📦 Données Specification reçues de ServiceNow :', specification);

  try {
    // Vérifier si une spécification avec ce sys_id existe déjà
    const existingSpec = await ProductSpecification.findOne({ sys_id: specification.sys_id });

    if (existingSpec) {
      // Si un document avec ce sys_id existe, on le met à jour
      console.log(`⚠️ Spécification avec sys_id ${specification.sys_id} déjà existante. Mise à jour...`);
      await ProductSpecification.updateOne({ sys_id: specification.sys_id }, specification);
      console.log('✅ Spécification mise à jour dans MongoDB');
    } else {
      // Sinon, on crée un nouveau document
      const newSpec = new ProductSpecification(specification);
      await newSpec.save();
      console.log('✅ Spécification enregistrée dans MongoDB');
    }
  } catch (err) {
    console.error('❌ Erreur MongoDB Specification :', err);
    return res.status(500).json({ error: 'Erreur MongoDB' });
  }

  // Envoi à Kafka
  const payloads = [
    {
      topic: process.env.KAFKA_TOPIC_SPECIFICATION,
      messages: JSON.stringify(specification),
    },
  ];

  producer.send(payloads, (err, data) => {
    if (err) {
      console.error('❌ Erreur Kafka Specification :', err);
      return res.status(500).json({ error: 'Erreur Kafka' });
    }
    console.log('📨 Message Specification envoyé à Kafka :', data);
    res.status(200).json({ message: 'Specification envoyée à Kafka et MongoDB', data });
  });
});

// ✅ Nouvelle Route DELETE : Supprimer une Product Specification
app.delete('/delete-specification/:id', async (req, res) => {
  const specSysId = req.params.id;

  try {
    // Recherche du document par sys_id et suppression
    const result = await ProductSpecification.findOneAndDelete({ sys_id: specSysId });

    if (result) {
      console.log(`🗑️ Specification supprimée de MongoDB (sys_id = ${specSysId})`);
      res.status(200).json({ message: 'Spécification supprimée avec succès.' });
    } else {
      console.warn(`⚠️ Aucune spécification trouvée avec sys_id = ${specSysId}`);
      res.status(404).json({ message: 'Spécification introuvable.' });
    }
  } catch (err) {
    console.error('❌ Erreur suppression MongoDB :', err);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API listening on port ${PORT}`);
});
