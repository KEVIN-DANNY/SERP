const { UpdateCommand, PutCommand, GetCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { ddbDocClient, tables, hasAwsCredentials } = require('./awsConfig');

/**
 * AWS DynamoDB Service with Atomic Conditional Update Locking
 */
class DynamoDbService {
  /**
   * Atomically decrements available_seats with ConditionExpression
   * Throws ConditionalCheckFailedException if available_seats <= 0
   */
  async atomicReserveSeat(eventId) {
    if (!hasAwsCredentials || !ddbDocClient) {
      return { simulated: true };
    }

    const command = new UpdateCommand({
      TableName: tables.events,
      Key: { id: eventId },
      UpdateExpression: 'SET available_seats = available_seats - :one',
      ConditionExpression: 'available_seats > :zero',
      ExpressionAttributeValues: {
        ':one': 1,
        ':zero': 0
      },
      ReturnValues: 'ALL_NEW'
    });

    try {
      const response = await ddbDocClient.send(command);
      return { success: true, updatedAttributes: response.Attributes };
    } catch (err) {
      if (err.name === 'ConditionalCheckFailedException') {
        const error = new Error('SOLD_OUT: DynamoDB Conditional Check Failed. Zero seats remaining.');
        error.statusCode = 409;
        throw error;
      }
      throw err;
    }
  }

  /**
   * Persists a confirmed registration to DynamoDB
   */
  async saveRegistration(registration) {
    if (!hasAwsCredentials || !ddbDocClient) {
      return { simulated: true };
    }

    const command = new PutCommand({
      TableName: tables.registrations,
      Item: {
        ...registration,
        createdAt: new Date().toISOString()
      }
    });

    return await ddbDocClient.send(command);
  }

  /**
   * Restores a seat upon cancellation
   */
  async restoreSeat(eventId) {
    if (!hasAwsCredentials || !ddbDocClient) {
      return { simulated: true };
    }

    const command = new UpdateCommand({
      TableName: tables.events,
      Key: { id: eventId },
      UpdateExpression: 'SET available_seats = available_seats + :one',
      ExpressionAttributeValues: {
        ':one': 1
      },
      ReturnValues: 'ALL_NEW'
    });

    return await ddbDocClient.send(command);
  }
}

module.exports = new DynamoDbService();
