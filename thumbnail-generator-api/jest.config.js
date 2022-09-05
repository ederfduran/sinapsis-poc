module.exports = {
	clearMocks: false,
	collectCoverage: true,
	coverageDirectory: "coverage",
	coverageProvider: "v8",
	testEnvironment: "node",
	roots: ["<rootDir>/test"],
	testMatch: ["**/*.test.ts"],
	transform: {
		"^.+\\.tsx?$": "ts-jest",
	},
	moduleNameMapper: {
		"^/opt/nodejs/thumbnail-request-dao":
			"<rootDir>/src/layers/common/nodejs/thumbnail-request-dao",
		"^/opt/nodejs/exception-handler":
			"<rootDir>/src/layers/common/nodejs/exception-handler",
		"^/opt/nodejs/responses": "<rootDir>/src/layers/common/nodejs/responses",
		"^/opt/nodejs/file-utils":
			"<rootDir>/src/layers/file-utils/nodejs/file-utils",
	},
};
