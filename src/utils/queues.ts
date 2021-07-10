import amqp, { Channel, Connection } from 'amqplib/callback_api';
const CONN_URL = process.env.CONN_URL

let channel: Channel;

amqp.connect(CONN_URL, function (error1, conn: Connection) {
    if (error1) {
        throw error1;
    }
    console.log("Connected to queue Successfully")
    conn.createChannel(function (err: any, ch: Channel) {
        if (err)
            throw err;

        channel = ch;
    });
});


export const publishToQueue = async (queueName: string, data: Buffer) => {
    channel.assertQueue(queueName, {
        durable: true
    });

    channel.sendToQueue(queueName, Buffer.from(data));
}


process.on('exit', () => {
    channel.close(() => {

        console.log(`Closing rabbitmq Channel`);
    });
});