import mongoose, { Schema } from "mongoose";
import { User } from "./user.model";


const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId, // one who is subcribing
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId, // one to whom 'subcriber' is subscribing
        ref: "User"
    }
}, { timestamps: true })


export const Subscription = mongoose.model("Subscription", subscriptionSchema)