import {  } from '../interfaces/project';
import { publishToQueue } from "../utils/queues";



const task_queue = "telegram_task_queue";
export const SendTelegram = async (payload: any): Promise<boolean> => {
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
            console.log("Sending Telegram");
            
            resolve(true);
        }

    })
}