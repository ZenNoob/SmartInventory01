import { config } from 'dotenv';
config();

import '@/ai/flows/predict-debt-risk.ts';
import '@/ai/flows/predict-inventory-shortage.ts';
import '@/ai/flows/forecast-sales.ts';
