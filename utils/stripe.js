import stripe from "stripe";

const stripeConfigured = stripe(process.env.STRIPE_SECRET_KEY);
export default stripeConfigured;
