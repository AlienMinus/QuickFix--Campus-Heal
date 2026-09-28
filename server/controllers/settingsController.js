const SystemSetting = require('../models/SystemSetting');

const DEFAULT_GLOBAL_HEADER = {
  name: 'Smart Campus QuickFix',
  subtitle: 'Civic & Facility Operations',
  tagline: 'Rapid Resolution Platform',
};

// GET /api/settings/global-header (Public)
exports.getGlobalHeader = async (req, res) => {
  try {
    const setting = await SystemSetting.findOne({ key: 'global_header' });
    const headerConfig = setting?.value || DEFAULT_GLOBAL_HEADER;
    return res.status(200).json({
      success: true,
      headerConfig,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/settings/global-header (Super Admin ONLY)
exports.updateGlobalHeader = async (req, res) => {
  try {
    if (req.user?.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only Super Admin is authorized to operate the global platform header.',
      });
    }

    const { name, subtitle, tagline } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Global portal name is required' });
    }

    const newConfig = {
      name: name.trim(),
      subtitle: subtitle?.trim() || 'Civic & Facility Operations',
      tagline: tagline?.trim() || 'Rapid Resolution Platform',
    };

    const setting = await SystemSetting.findOneAndUpdate(
      { key: 'global_header' },
      { key: 'global_header', value: newConfig },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Global portal header updated successfully',
      headerConfig: setting.value,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
