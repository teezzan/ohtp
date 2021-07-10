import axios from "axios"
import crypto from "crypto"
import { WebHookPayload } from "../interfaces/project"
import { publishToQueue } from "../utils/queues"

const task_queue = "webhook_task_queue"
export const SendWebHook = async (payload: WebHookPayload): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        let dataToSend = {
            event: "authentication.success",
            data: {
                meta: payload.meta,
                medium: payload.medium,
                type: payload.type,
                time: new Date(),
            }
        }
        //send webhook with secrete key encryption
        if (process.env.USE_QUEUEn == "true") {

            publishToQueue(task_queue, JSON.stringify(payload)).then(() => {
                resolve(true);
            }).catch((err: any) => {
                console.log(err);
                reject(false);
            })
        }
        else {
            let hash = crypto
                .createHmac("sha512", payload.secret_key)
                .update(JSON.stringify(dataToSend))
                .digest("hex");

            axios.post(
                payload.webhook_url,
                dataToSend,
                {
                    headers: {
                        "x-ohtp-signature": hash,
                        "Content-Type":
                            "application/json",
                    },
                }).then((res) => {
                    console.log("res", res.status);
                    resolve(true)

                }).catch((err: any) => {
                    console.log(err);
                    reject(false);
                })

        }
    })
}