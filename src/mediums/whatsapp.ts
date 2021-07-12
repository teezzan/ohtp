
import twilio from 'twilio';
import { SMSPayload } from '../interfaces/project';
import { publishToQueue } from "../utils/queues";

const authToken = process.env.TWILIO_AUTH_TOKEN;
const accountSid = process.env.TWILIO_ACCOUNT_SID;

const client = twilio(accountSid, authToken);
const task_queue = "whatsapp_task_queue";


export const SendWhatsapp = async (payload: SMSPayload): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {

        if (process.env.USE_QUEUE == "true") {

            publishToQueue(task_queue, JSON.stringify(payload)).then(() => {
                resolve(true);
            }).catch((err: any) => {
                console.log(err);
                reject(false);
            })
        }
        else {
            console.log("Whatsapp Started ", payload);

            client.messages
                .create({
                    from: `whatsapp:${payload.from}`,
                    body: payload.body,
                    to: `whatsapp:${payload.to}`
                })
                .then(message => {
                    console.log(message.sid)
                    resolve(true);
                }).catch((err: any) => {
                    console.log(err);
                    reject(false);
                })
        }
    })
}