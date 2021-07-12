import nodemailer from "nodemailer";
import { publishToQueue } from "../utils/queues";
const task_queue = "email_task_queue";


const testAccount = {
    user: "caitlyn.waelchi86@ethereal.email",
    pass: "XZJWNbvRcKeWS1TuT3"
};

const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: testAccount.user,
        pass: testAccount.pass,
    },
});

export const SendEmail = async (payload: any): Promise<boolean> => {
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
            try {
                await transporter.sendMail(payload);
                resolve(true);
            }
            catch (err) {
                console.log(err);
                resolve(false);
            }
        }

    })

};