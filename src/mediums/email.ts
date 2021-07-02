import nodemailer from "nodemailer";

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
    if (!payload)
        payload = {
            from: "\"Fred Foo 👻\" <foo@example.com>",
            to: "bar@example.com, baz@example.com",
            subject: "Hello ✔",
            text: "Hello world?",
            html: "<b>Hello world?</b>",
        };
    try {
        await transporter.sendMail(payload);
        return true;
    }
    catch (err) {
        return false;
    }

};