import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { deleteTodo } from '../../DataLayer/Todo'
import { createLogger } from '../../utils/logger'
import { getResponseHeaders } from '../utils'

const logger = createLogger('deleteTodo')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId

  const response = await deleteTodo(todoId, event)

  logger.info(response);

  if (!response) {
    const errorMessage = 'Unable to delete to do'
    
    logger.error(errorMessage)

    return {
      headers: getResponseHeaders(),
      statusCode: 422,
      body: JSON.stringify({message: errorMessage})
    }
  }
  
  return {
    statusCode: 200,
    headers: getResponseHeaders(),
    body: 'To do deleted'
  }
}
