import { proxyApiRequest } from "@/lib/api-client";

export const POST = (request: Request) => proxyApiRequest(request, "/v1/api/scan/reject");
