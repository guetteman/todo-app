import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { createTodo } from '../../DataLayer/Todo'
import { createLogger } from '../../utils/logger'
import { getResponseHeaders } from '../utils'

const logger = createLogger('createTodo')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const newTodoData: CreateTodoRequest = JSON.parse(event.body)
  const newTodo = await createTodo(newTodoData, event)

  if (!newTodo) {
    const errorMessage = 'Unable to create to do'
    
    logger.error(errorMessage)

    return {
      headers: getResponseHeaders(),
      statusCode: 422,
      body: JSON.stringify({message: errorMessage})
    }
  }
  
  logger.info('New to do:', newTodo)
  
  return {
    statusCode: 200,
    headers: getResponseHeaders(),
    body: JSON.stringify({item: newTodo})
  }
}
