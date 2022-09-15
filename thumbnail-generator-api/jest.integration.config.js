const jestCommon = require("./jest.config");

module.exports = {
	...jestCommon,
	roots: ["<rootDir>/test/integration"],
	testTimeout: 30000, // 30s,
	modulePathIgnorePatterns: ["_mock_"],
	setupFiles: ["dotenv/config"],
};
