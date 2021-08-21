import { App } from "@aws-cdk/core";
import { CdkPlayStack } from "./cdk-play-stack";

const app = new App();
new CdkPlayStack(app, "hello-cdk");
app.synth();
