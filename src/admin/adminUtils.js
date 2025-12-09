import { auth, db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// SUPER ADMIN EMAIL - Change this to your email
const SUPER_ADMIN_EMAIL = "superadmin@gmail.com";

/**
 * Check if the current user is the super admin
 * @returns {boolean} True if user is super admin
 */
export const isSuperAdmin = () => {
  const user = auth.currentUser;
  return user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
};

/**
 * Check if the current user has admin privileges
 * Checks both super admin and Firestore admin list
 * @returns {Promise<boolean>} True if user is admin, false otherwise
 */
export const checkAdminStatus = async () => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      return false;
    }

    // Check if super admin
    if (isSuperAdmin()) {
      return true;
    }

    // Check if email is in admins collection
    const adminsRef = collection(db, 'admins');
    const q = query(adminsRef, where('email', '==', user.email.toLowerCase()));
    const querySnapshot = await getDocs(q);
    
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Get all admins from Firestore
 * @returns {Promise<Array>} List of admin users
 */
export const getAllAdmins = async () => {
  try {
    const adminsRef = collection(db, 'admins');
    const querySnapshot = await getDocs(adminsRef);
    
    const admins = [];
    querySnapshot.forEach((doc) => {
      admins.push({ id: doc.id, ...doc.data() });
    });
    
    return admins;
  } catch (error) {
    console.error('Error getting admins:', error);
    return [];
  }
};

/**
 * Get admin-specific user data
 * @returns {Promise<Object|null>} Admin user data or null
 */
export const getAdminUserData = async () => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      return null;
    }

    const isAdmin = await checkAdminStatus();
    
    if (!isAdmin) {
      return null;
    }

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      isAdmin: true,
      isSuperAdmin: isSuperAdmin()
    };
  } catch (error) {
    console.error('Error getting admin user data:', error);
    return null;
  }
};
