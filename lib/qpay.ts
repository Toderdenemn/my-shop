import axios from "axios";

const BASE_URL = process.env.QPAY_BASE_URL || "https://merchant-sandbox.qpay.mn";
const USERNAME = process.env.QPAY_USERNAME || "TEST_MERCHANT";
const PASSWORD = process.env.QPAY_PASSWORD || "123456";
const INVOICE_CODE = process.env.QPAY_INVOICE_CODE || "TEST_INVOICE";

let accessToken: string | null = null;
let tokenExpiry: number = 0;

async function getToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const response = await axios.post(
    `${BASE_URL}/v2/auth/token`,
    {},
    {
      auth: { username: USERNAME, password: PASSWORD },
    }
  );

  accessToken = response.data.access_token;
  const expiresIn = response.data.expires_in || 3600;
  tokenExpiry = Date.now() + (expiresIn - 60) * 1000;

  return accessToken!;
}

export async function createQPayInvoice(params: {
  orderId: string;
  amount: number;
  description: string;
  callbackUrl: string;
}) {
  const token = await getToken();

  const response = await axios.post(
    `${BASE_URL}/v2/invoice`,
    {
      invoice_code: INVOICE_CODE,
      sender_invoice_no: params.orderId,
      invoice_receiver_code: "terminal",
      invoice_description: params.description,
      amount: params.amount,
      callback_url: params.callbackUrl,
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return response.data;
}

export async function checkQPayPayment(invoiceId: string) {
  const token = await getToken();

  const response = await axios.post(
    `${BASE_URL}/v2/payment/check`,
    { object_type: "INVOICE", object_id: invoiceId, offset: { page_number: 1, page_limit: 100 } },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return response.data;
}
