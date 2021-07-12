
import twilio from 'twilio';
import { publishToQueue } from "../utils/queues";

const authToken = process.env.TWILIO_AUTH_TOKEN;
const accountSid = process.env.TWILIO_ACCOUNT_SID;

const client = twilio(accountSid, authToken);


const task_queue = "sms_task_queue";
export const SendSMS = async (payload: any): Promise<boolean> => {
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
            //send sms here
            client.messages
                .create({
                    body: payload.message,
                    from: payload.from,
                    to: payload.to
                })
                .then((message: any) => {
                    console.log(message.sid)
                    resolve(true)
                }).catch((err: any) => {
                    console.log(err);
                    reject(false);
                })
        }
    })
}