const Responses = {
	_DefineResponse(statusCode = 502, data = {}) {
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

	OK(data = {}) {
		return this._DefineResponse(200, data);
	},

	CREATED(data = {}) {
		return this._DefineResponse(201, data);
	},

	BAD_REQUEST(data = {}) {
		return this._DefineResponse(400, data);
	},
	NOT_FOUND(data = {}) {
		return this._DefineResponse(404, data);
	},
	INTERNAL_ERROR(data = {}) {
		return this._DefineResponse(404, data);
	},
};

export default Responses;
