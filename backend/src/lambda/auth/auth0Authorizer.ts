import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

const jwksUrl = 'https://guetteluis.auth0.com/.well-known/jwks.json'

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  const jwt: Jwt = decode(token, { complete: true }) as Jwt
  const kidHeader:string = jwt.header.kid
  
  const signingCertificate = await getJwks(jwksUrl, kidHeader)
  const pemCertificate = certificateToPem(signingCertificate)

  return verify(token, pemCertificate, { algorithms: ['RS256'] }) as JwtPayload
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}

async function getJwks(jwksUrl: string, kidHeader: string) {
  const response = await Axios.get(jwksUrl)
  const jwks: any[] = response.data.keys

  const key = getSigningKey(jwks, kidHeader)

  if (!key) throw new Error('The JWKS endpoint did not contain any signing key')

  return key.x5c[0]
}

function getSigningKey(jwks: any[], kidHeader:string) {
  return jwks.find(key => key.kid === kidHeader && key.kty === 'RSA')
}

function certificateToPem(certificate:string):string {
  return '-----BEGIN CERTIFICATE-----\n'
    + certificate
    + "\n-----END CERTIFICATE-----"
}