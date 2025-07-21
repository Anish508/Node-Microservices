const amqp = require('amqplib');
const logger = require('./logger.js');

let connection = null;
let channel = null;

const ExchangeName = 'facebook_event';

async function connectToRabbitMQ() {
      try {
            connection = await amqp.connect(process.env.RabbitMQ_URL);
            channel = await connection.createChannel();
            await channel.assertExchange(ExchangeName, 'direct', { durable: true });
            logger.info('Connected to RabbitMQ successfully');
      } catch (error) {
            logger.error('Error connecting to RabbitMQ:', error);
            throw error;
      }
}

module.exports = connectToRabbitMQ