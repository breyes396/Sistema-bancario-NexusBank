import mongoose from 'mongoose';

const { Schema } = mongoose;

const AdminSchema = new Schema({
  name: { 
    type: String, 
    required: true 
},
  email: { 
    type: String, 
    required: true, 
    unique: true 
},
  password: { 
    type: String, 
    required: true 
},
  phone: { 
    type: String, 
    required: false 
},
  status: { 
    type: Boolean, 
    default: true 
},
  lastLogin: { 
    type: Date 
}
}, {
  collection: 'admins',
  timestamps: true
});

export const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);
