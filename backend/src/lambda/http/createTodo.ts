import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { createTodo } from '../../DataLayer/Todo';
import { createLogger } from '../../utils/logger'

const logger = createLogger('createtodo')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const newTodoData: CreateTodoRequest = JSON.parse(event.body)

  logger.info('hola:', newTodoData)
  const newTodo = await createTodo(newTodoData, event)

  let status = 201;

  if (!newTodo) {
    status = 422
    logger.error('Unable to create to do')
  } else {
    logger.info('New to do:', newTodo)
  }
  
  return {
    statusCode: status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      newTodo
    })

  }
}
