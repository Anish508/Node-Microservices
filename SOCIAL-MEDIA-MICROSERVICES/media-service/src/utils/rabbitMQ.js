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
      if (!channel) {
            await connectToRabbitMQ()
      }
      channel.publish(ExchangeName, routingKey, Buffer.from(JSON.stringify(message)))
      logger.info(`Event published : ${routingKey}`)
}

async function consumeEvent(routingKey, callback) {
      if (!channel) {
            connectToRabbitMQ()
      }

      const q = await channel.assertQueue("", { exclusive: true })

      await channel.bindQueue(q.queue, ExchangeName, routingKey)
      channel.consume(q.queue, (msg) => {
            if (msg !== null) {
                  const content = JSON.parse(msg.content.toString());
                  callback(content)
                  channel.ack(msg)
            }
      })
      logger.info(`Subscribed to event:${routingKey}`)
}
module.exports = { connectToRabbitMQ, publishEvent , consumeEvent}