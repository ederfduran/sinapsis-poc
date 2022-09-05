export interface IResponse {
	_DefineResponse: (statusCode: number, data: any) => IHttpResponse;
	OK: (data: any) => IHttpResponse;
	CREATED: (data: any) => IHttpResponse;
	BAD_REQUEST: (data: any) => IHttpResponse;
	NOT_FOUND: (data: any) => IHttpResponse;
	INTERNAL_ERROR: (data: any) => IHttpResponse;
}

export interface IHttpResponse {
	headers: any;
	statusCode: number;
	body: string;
}

const Responses: IResponse = {
	_DefineResponse(statusCode = 502, data = {}): IHttpResponse {
		return {
			headers: {
				"Content-Type": "application/json",
				"Access-Control-Allow-Methods": "*",
				"Access-Control-Allow-Origin": "*",
			},
			statusCode,
			body: JSON.stringify(data),
		};
	},

	OK(data = {}): IHttpResponse {
		return this._DefineResponse(200, data);
	},

	CREATED(data = {}): IHttpResponse {
		return this._DefineResponse(201, data);
	},

	BAD_REQUEST(data = {}): IHttpResponse {
		return this._DefineResponse(400, data);
	},
	NOT_FOUND(data = {}): IHttpResponse {
		return this._DefineResponse(404, data);
	},
	INTERNAL_ERROR(data = {}): IHttpResponse {
		return this._DefineResponse(500, data);
	},
};

export default Responses;
