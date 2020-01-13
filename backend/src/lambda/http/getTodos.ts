import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { getTodos } from '../../DataLayer/Todo'
import { createLogger } from '../../utils/logger'
import { getResponseHeaders } from '../utils'

const logger = createLogger('getTodos')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todos = await getTodos(event)

  if (!todos) {
    const errorMessage = 'Unable to get to do\'s'
    
    logger.error(errorMessage)

    return {
      headers: getResponseHeaders(),
      statusCode: 404,
      body: JSON.stringify({message: errorMessage})
    }
  }
    
  logger.info('To do\'s:', todos)

  return {
    statusCode: 200,
    headers: getResponseHeaders(),
    body: JSON.stringify({items: todos})
  }
}
