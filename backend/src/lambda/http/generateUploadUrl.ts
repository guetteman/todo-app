import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { todoExists, getUploadUrl, updateUrl } from '../../DataLayer/Todo'
import { createLogger } from '../../utils/logger'
import { getResponseHeaders } from '../utils'

const logger = createLogger('generateUploadUrl')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId

  const todoIsValid = todoExists(todoId, event)

  if (!todoIsValid) {
    const errorMessage = 'Unable to get to do\'s'
    
    logger.error(errorMessage)

    return {
      headers: getResponseHeaders(),
      statusCode: 404,
      body: JSON.stringify({message: errorMessage})
    }
  }

  const uploadUrl = getUploadUrl(todoId)
  const updateTodoImageUrl = await updateUrl(todoId, event, uploadUrl.split("?")[0])

  logger.info(uploadUrl)
  logger.info(updateTodoImageUrl)
  
  return {
    statusCode: 200,
    headers: getResponseHeaders(),
    body: JSON.stringify({uploadUrl: uploadUrl})
  }
}
