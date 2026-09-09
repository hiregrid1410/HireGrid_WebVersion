const adminUsersRepo = require("./admin-users.repository");

class AdminUsersService {
  async getAdminUsers() {
    return adminUsersRepo.getAdminUsers();
  }

  async saveAdminUser(data) {
    await adminUsersRepo.saveAdminUser(data);
    return { success: true };
  }

  async updateAdminUser(id, data) {
    await adminUsersRepo.updateAdminUser(id, data);
    return { success: true };
  }

  async deleteAdminUser(id) {
    await adminUsersRepo.deleteAdminUser(id);
    return { success: true };
  }
}

module.exports = new AdminUsersService();
