// Parse User-Agent to extract device information
export const parseUserAgent = (userAgent) => {
    const ua = userAgent.toLowerCase();
    
    // Detect Browser
    let browser = 'Unknown';
    if (ua.includes('edg/') || ua.includes('edge')) {
        browser = 'Microsoft Edge';
    } else if (ua.includes('chrome') && !ua.includes('edg')) {
        browser = 'Google Chrome';
    } else if (ua.includes('firefox')) {
        browser = 'Mozilla Firefox';
    } else if (ua.includes('safari') && !ua.includes('chrome')) {
        browser = 'Safari';
    } else if (ua.includes('opera') || ua.includes('opr')) {
        browser = 'Opera';
    }
    
    // Detect Operating System
    let os = 'Unknown';
    if (ua.includes('windows nt 10')) {
        os = 'Windows 10/11';
    } else if (ua.includes('windows nt 6.3')) {
        os = 'Windows 8.1';
    } else if (ua.includes('windows nt 6.2')) {
        os = 'Windows 8';
    } else if (ua.includes('windows nt 6.1')) {
        os = 'Windows 7';
    } else if (ua.includes('windows')) {
        os = 'Windows';
    } else if (ua.includes('mac os x')) {
        os = 'macOS';
    } else if (ua.includes('android')) {
        os = 'Android';
    } else if (ua.includes('iphone') || ua.includes('ipad')) {
        os = 'iOS';
    } else if (ua.includes('linux')) {
        os = 'Linux';
    }
    
    // Detect Device Type
    let deviceType = 'desktop';
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
        deviceType = 'mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
        deviceType = 'tablet';
    } else if (ua.includes('windows') || ua.includes('macintosh')) {
        // Distinguish between desktop and laptop is difficult, default to desktop
        deviceType = 'desktop';
    }
    
    return {
        browser,
        os,
        deviceType
    };
};

// Get IP address from request
export const getIpAddress = (req) => {
    // Check various headers for IP (useful behind proxies/load balancers)
    const ip = req.headers['x-forwarded-for'] || 
               req.headers['x-real-ip'] || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress ||
               req.ip ||
               'Unknown';
    
    // Clean up IPv6 localhost
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
        return '127.0.0.1';
    }
    
    // If multiple IPs, take the first one
    return ip.split(',')[0].trim();
};

// Check if current time is within allowed hours for mobile (10 AM - 1 PM)
export const isMobileAccessAllowed = () => {
    const currentHour = new Date().getHours();
    return currentHour >= 10 && currentHour < 13; // 10 AM to 12:59 PM
};

// Check if browser requires OTP
export const requiresOTP = (browser) => {
    return browser === 'Google Chrome';
};

// Check if browser gets direct access
export const hasDirectAccess = (browser) => {
    return browser === 'Microsoft Edge';
};
