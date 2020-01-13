import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { updateTodo } from '../../DataLayer/Todo'
import { createLogger } from '../../utils/logger'
import { getResponseHeaders } from '../utils'

const logger = createLogger('updateTodo')


export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const todoData: UpdateTodoRequest = JSON.parse(event.body)

  const updatedTodo = updateTodo(todoData, todoId, event)

  if (!updatedTodo) {
    const errorMessage = 'Unable to update to do'
    
    logger.error(errorMessage)

    return {
      headers: getResponseHeaders(),
      statusCode: 422,
      body: JSON.stringify({message: errorMessage})
    }
  }
  
  logger.info('Updated to do:', updatedTodo)
  
  return {
    statusCode: 200,
    headers: getResponseHeaders(),
    body: JSON.stringify({item: updatedTodo})
  }
}
