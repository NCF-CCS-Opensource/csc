import { proxyApiRequest } from "@/lib/api-client";

export const GET = (request: Request) => proxyApiRequest(request, "/v1/api/scan/rejections");
