import * as sns from "@aws-cdk/aws-sns";
import * as subs from "@aws-cdk/aws-sns-subscriptions";
import * as sqs from "@aws-cdk/aws-sqs";
import * as cdk from "@aws-cdk/core";
import * as s3 from "@aws-cdk/aws-s3";
import * as iam from "@aws-cdk/aws-iam";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigateway from "@aws-cdk/aws-apigateway";
import { Duration } from "@aws-cdk/core";

export class CdkPlayStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, "CdkPlayBucket");

    const result = bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        resources: ["*"],
        principals: [new iam.AccountRootPrincipal()],
      })
    );

    bucket.addCorsRule({
      allowedMethods: [
        s3.HttpMethods.GET,
        s3.HttpMethods.POST,
        s3.HttpMethods.PUT,
      ],
      allowedOrigins: ["https://smashingmagazine.com"],
      allowedHeaders: ["*"],
    });

    bucket.addLifecycleRule({
      abortIncompleteMultipartUploadAfter: Duration.days(7),
      enabled: true,
      id: "lifecycleRule",
    });

    const table = new dynamodb.Table(this, "CdkPlayTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    const readScaling = table.autoScaleReadCapacity({
      minCapacity: 1,
      maxCapacity: 50,
    });

    readScaling.scaleOnUtilization({
      targetUtilizationPercent: 50,
    });

    const backend = new lambda.Function(this, "CDKPlayLambda", {
      code: lambda.Code.fromInline(
        'exports.handler = function(event, ctx, cb) { return cb(null, "success"); }'
      ),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_14_X,
    });

    const api = new apigateway.LambdaRestApi(this, "CDKPlayAPI", {
      handler: backend,
      proxy: false,
    });

    const items = api.root.addResource("items");
    items.addMethod("GET"); // GET /items
    items.addMethod("POST"); // POST /items

    const item = items.addResource("{item}");
    item.addMethod("GET");

    const queue = new sqs.Queue(this, "CdkPlayQueue", {
      visibilityTimeout: cdk.Duration.seconds(300),
    });

    const topic = new sns.Topic(this, "CdkPlayTopic");

    topic.addSubscription(new subs.SqsSubscription(queue));
  }
}
