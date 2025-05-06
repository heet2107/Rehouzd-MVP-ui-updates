import * as specialistModel from '../../models/specialistCallback/specialistModel';
import * as userModel from '../../models/auth/userModel';
import { sendEmail } from '../../utils/emailService';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

interface SpecialistResult {
  success: boolean;
  message: string;
  id?: number;
  code?: number;
}

/**
 * Get all specialist call requests with user details
 */
export const getAllSpecialistCalls = async (): Promise<any[]> => {
  try {
    return await specialistModel.getAllSpecialistCallsWithUser();
  } catch (error) {
    console.error('Error getting all specialist calls:', error);
    throw error;
  }
};

/**
 * Get latest specialist call requests (one per user)
 */
export const getLatestSpecialistCalls = async (): Promise<any[]> => {
  try {
    return await specialistModel.getDistinctSpecialistCalls();
  } catch (error) {
    console.error('Error getting latest specialist calls:', error);
    throw error;
  }
};

/**
 * Create a new specialist call request
 * @param userId - The user ID (can be null for anonymous requests)
 * @param mobileNumber - The mobile number to call back
 * @param requestedAt - Optional timestamp for when the request was made
 */
export const createSpecialistCallRequest = async (
  userId: number | null,
  mobileNumber: number | string,
  requestedAt?: string
): Promise<SpecialistResult> => {
  try {
    // For authenticated users, check and update mobile number if needed
    if (userId) {
      try {
        const mobileNumberAsNumber = typeof mobileNumber === 'string' 
          ? parseInt(mobileNumber as string) 
          : mobileNumber;
          
        await userModel.checkAndUpdateMobileNumber(userId, mobileNumberAsNumber);
      } catch (updateError) {
        console.error('Error updating user mobile number:', updateError);
        // Continue even if the update fails
      }
    }

    // Save specialist call
    const callId = await specialistModel.saveSpecialistCall({
      user_id: userId || 0, // Use 0 for anonymous users
      mobile_number: mobileNumber,
      requested_at: requestedAt
    });

    // Get user email for notification (only for authenticated users)
    if (userId) {
      try {
        const email = await userModel.getUserEmailById(userId);
        
        // Send email notification if email exists
        if (email) {
          await sendEmail(
            email,
            'Specialist Call Request Confirmation',
            `Your specialist call back request has been successfully received. Our specialist will contact you shortly.`
          );
        }
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
        // Continue even if email fails
      }
    }

    return {
      success: true,
      message: 'Specialist call saved successfully',
      id: callId
    };
  } catch (error: any) {
    console.error('Error creating specialist call request:', error);
    return {
      success: false,
      message: `Failed to save specialist call: ${error.message}`,
      code: 500
    };
  }
};