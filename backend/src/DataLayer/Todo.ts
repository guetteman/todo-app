import { CreateTodoRequest } from "../requests/CreateTodoRequest";
import { APIGatewayProxyEvent } from 'aws-lambda'
import * as AWS from 'aws-sdk'
import * as AWSXRAY from 'aws-xray-sdk'
import { getUserId } from "../lambda/utils";
import * as uuid from 'uuid'

const XAWS = AWSXRAY.captureAWS(AWS)
const TABLE = process.env.TODOS_TABLE

export async function createTodo(data: CreateTodoRequest, event:APIGatewayProxyEvent) {
    const docClient = new XAWS.DynamoDB.DocumentClient

    const todo = {
        userId: getUserId(event),
        todoId: uuid.v4(),
        createdAt: (new Date()).toISOString(),
        name: data.name,
        dueDate: data.dueDate
    }

    await docClient.put({
        TableName: TABLE,
        Item: todo      
    }).promise()

    return todo
}