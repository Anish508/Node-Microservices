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

async function publishEvent(routingKey, message) {
  try {
    if (!channel) {
      await connectToRabbitMQ();
    }

    const payload = Buffer.from(JSON.stringify(message));
    const success = channel.publish(ExchangeName, routingKey, payload);

    if (success) {
      logger.info(`Event published: ${routingKey}`);
    } else {
      logger.warn(`Event not published: ${routingKey}`);
    }
  } catch (err) {
    logger.error("Failed to publish event:", err);
  }
}

module.exports = {connectToRabbitMQ, publishEvent}