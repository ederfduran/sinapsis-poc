import * as cdk from "aws-cdk-lib";
// import {
// 	CorsHttpMethod,
// 	HttpApi,
// 	HttpMethod,
// 	HttpStage,
// } from "@aws-cdk/aws-apigatewayv2-alpha";
// import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import {
	ApiDefinition,
	EndpointType,
	SpecRestApi,
} from "aws-cdk-lib/aws-apigateway";
import { Function as LambdaFunction } from "aws-cdk-lib/aws-lambda";
import { Asset } from "aws-cdk-lib/aws-s3-assets";
import { Construct } from "constructs";
import * as path from "path";
import { CDKContext } from "../types";

export class ApiGatewayStack {
	static DEFAULT_STAGE: string = "live";
	//api: HttpApi;
	api_: SpecRestApi;
	stack: Construct;
	constructor(
		scope: Construct,
		thumbnailGen: LambdaFunction,
		thumbnailGenStatus: LambdaFunction,
		context: CDKContext
	) {
		this.stack = scope;

		const asset = new Asset(this.stack, "apiSpec", {
			path: path.join(__dirname, `/../openapi/thumbnails-api.yml`),
		});

		const apiDefinition = ApiDefinition.fromInline(
			cdk.Fn.transform("AWS::Include", { Location: asset.s3ObjectUrl })
		);

		this.api_ = new SpecRestApi(this.stack, "thumbnails-gen-api", {
			apiDefinition: apiDefinition,
			restApiName: `thumbnails-gen-api-${context.environment}`,
			endpointTypes: [EndpointType.REGIONAL],
			deployOptions: {
				stageName: ApiGatewayStack.DEFAULT_STAGE,
			},
			deploy: true,
			endpointExportName: "thumbnailApiUrl",
		});

		// const cfnSizeConstraintSet = new CfnSizeConstraintSet(
		// 	this,
		// 	"MyCfnSizeConstraintSet",
		// 	{
		// 		name: "ImageSizeConstraint",
		// 		sizeConstraints: [
		// 			{
		// 				comparisonOperator: "GE",
		// 				fieldToMatch: {
		// 					type: "BODY",
		// 				},
		// 				size: 5242880, // 5MG
		// 				textTransformation: "NONE",
		// 			},
		// 		],
		// 	}
		// );
		// this.api = new HttpApi(this.stack, "thumbnails-api", {
		// 	description: "HTTP API to generate thumbnails from png/jpg image",
		// 	corsPreflight: {
		// 		allowHeaders: [
		// 			"Content-Type",
		// 			"X-Amz-Date",
		// 			"Authorization",
		// 			"X-Api-Key",
		// 		],
		// 		allowMethods: [
		// 			CorsHttpMethod.OPTIONS,
		// 			CorsHttpMethod.GET,
		// 			CorsHttpMethod.POST,
		// 			CorsHttpMethod.PUT,
		// 			CorsHttpMethod.PATCH,
		// 			CorsHttpMethod.DELETE,
		// 		],
		// 		allowOrigins: ["*"],
		// 	},
		// });

		// 	this.enableDefaultStage();

		// 	this.api.addRoutes({
		// 		path: "/api/v1/thumbnail-gen",
		// 		methods: [HttpMethod.POST],
		// 		integration: new HttpLambdaIntegration(
		// 			"post-thumbnail-gen",
		// 			thumbnailGen
		// 		),
		// 	});

		// 	this.api.addRoutes({
		// 		path: "/api/v1/thumbnail-gen/status/{requestId}",
		// 		methods: [HttpMethod.GET],
		// 		integration: new HttpLambdaIntegration(
		// 			"get-thumbnail-gen-status",
		// 			thumbnailGenStatus
		// 		),
		// 	});

		// 	this.api.addRoutes({
		// 		path: "/api/v1/thumbnail-gen/download/{requestId}",
		// 		methods: [HttpMethod.GET],
		// 		integration: new HttpLambdaIntegration(
		// 			"get-thumbnail-gen-download",
		// 			thumbnailGenDownload
		// 		),
		// 	});

		// 	new cdk.CfnOutput(this.stack, "apiUrl", {
		// 		value: this.api.url!,
		// 	});
		// }

		// private enableDefaultStage() {
		// 	new HttpStage(this.stack, "defaultApiStage", {
		// 		httpApi: this.api,
		// 		stageName: ApiGatewayStack.DEFAULT_STAGE,
		// 		autoDeploy: true,
		// 	});
		// }
	}
}
