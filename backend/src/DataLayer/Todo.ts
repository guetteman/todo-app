import { CreateTodoRequest } from "../requests/CreateTodoRequest";
import { APIGatewayProxyEvent } from 'aws-lambda'
import * as AWS from 'aws-sdk'
import * as AWSXRAY from 'aws-xray-sdk'
import { getUserId } from "../lambda/utils";
import * as uuid from 'uuid'
import { UpdateTodoRequest } from "../requests/UpdateTodoRequest";

const XAWS = AWSXRAY.captureAWS(AWS)
const TABLE_NAME = process.env.TODOS_TABLE
const BUCKET = process.env.S3_BUCKET

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
        TableName: TABLE_NAME,
        Item: todo      
    }).promise()

    return todo
}

export async function getTodos(event:APIGatewayProxyEvent) {
    const response = await docClient.query({
        TableName: TABLE_NAME,
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
        TableName: TABLE_NAME,
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

export async function deleteTodo(todoId:string, event:APIGatewayProxyEvent) {
    return await docClient.delete({
        TableName: TABLE_NAME,
        Key: {
            todoId: todoId,
            userId: getUserId(event)
        }
    }).promise()
}

export function getUploadUrl(todoId: string) {
    const s3 = new XAWS.S3({ signatureVersion: 'v4'})
    const urlExpiration = process.env.SIGNED_URL_EXPIRATION

    return s3.getSignedUrl('putObject', {
        Bucket: BUCKET,
        Key: todoId,
        Expires: urlExpiration
    })
}

export async function updateUrl(todoId: string, event:APIGatewayProxyEvent){
    const url =  `https://${BUCKET}.s3.amazonaws.com/${todoId}`
    
    return await docClient.update({
        TableName: TABLE_NAME,
        Key: {
          todoId: todoId,
          userId: getUserId(event)
        },
        UpdateExpression: 'set uploadUrl = :uploadUrl',
        ExpressionAttributeValues: {
            ':uploadUrl': url
        },
        ReturnValues: "UPDATED_NEW"
    })
    .promise()
}

export async function todoExists(todoId: string, event:APIGatewayProxyEvent) {
    const response = await docClient.get({
        TableName: TABLE_NAME,
        Key: {
            todoId: todoId,
            userId: getUserId(event)
        }
    }).promise()
  
    return !!response.Item
}