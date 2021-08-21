#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { CdkPlayStack } from '../lib/cdk-play-stack';

const app = new cdk.App();
new CdkPlayStack(app, 'CdkPlayStack');
