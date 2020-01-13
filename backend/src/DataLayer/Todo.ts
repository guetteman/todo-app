import { CreateTodoRequest } from "../requests/CreateTodoRequest";
import { APIGatewayProxyEvent } from 'aws-lambda'
import * as AWS from 'aws-sdk'
import * as AWSXRAY from 'aws-xray-sdk'
import { getUserId } from "../lambda/utils";
import * as uuid from 'uuid'
import { UpdateTodoRequest } from "../requests/UpdateTodoRequest";

const XAWS = AWSXRAY.captureAWS(AWS)
const TABLE = process.env.TODOS_TABLE
const docClient = new XAWS.DynamoDB.DocumentClient

export async function createTodo(data: CreateTodoRequest, event:APIGatewayProxyEvent) {
    const todo = {
        userId: getUserId(event),
        todoId: uuid.v4(),
        createdAt: (new Date()).toISOString(),
        name: data.name,
        dueDate: data.dueDate,
        done: false
    }

    await docClient.put({
        TableName: TABLE,
        Item: todo      
    }).promise()

    return todo
}

export async function getTodos(event:APIGatewayProxyEvent) {
    const response = await docClient.query({
        TableName: TABLE,
        IndexName: process.env.USER_ID_INDEX,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': getUserId(event)
        }
    }).promise()

    return response.Items
}

export async function updateTodo(data:UpdateTodoRequest, todoId:string, event:APIGatewayProxyEvent) {
    return await docClient.update({
        TableName: TABLE,
        Key: {
            todoId: todoId,
            userId: getUserId(event)
        },
        UpdateExpression: 'set todoname = :todoname, done = :done, dueDate = :dueDate',
        ExpressionAttributeValues: {
            ':todoname': data.name,
            ':done': data.done,
            ':dueDate': data.dueDate
        },
        ReturnValues: "UPDATED_NEW"     
          
    }).promise();
}