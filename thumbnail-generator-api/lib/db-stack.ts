import * as cdk from "aws-cdk-lib";
import {
	AttributeType,
	Table,
	TableEncryption,
} from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export class DbStack extends cdk.Stack {
	thumbnailRequestTable: Table;

	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);
		this.thumbnailRequestTable = new Table(this, "dynamodb-table", {
			partitionKey: { name: "requestId", type: AttributeType.STRING },
			encryption: TableEncryption.DEFAULT,
			// Not recomended for prod
			removalPolicy: cdk.RemovalPolicy.DESTROY,
		});

		new cdk.CfnOutput(this, "thumbnailRequestTableName", {
			value: this.thumbnailRequestTable.tableName,
		});
	}
}
