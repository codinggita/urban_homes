import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRef } from 'react';
import {getDownloadURL, getStorage, ref, uploadBytesResumable} from 'firebase/storage'
import { app } from '../firebase';
import { updateUserStart,updateUserSuccess, updateUserFailure, deleteUserFailure, deleteUserStart, deleteUserSuccess } from '../redux/user/userSlice';

export default function Profile() {
  const fileRef = useRef(null);
  const {currentUser, loading, error} = useSelector(state => state.user);
  const [file,setFile] = useState(undefined);
  const [filePercentage, setFilePercentage] = useState(0);
  const [fileUploadError,setFileUploadError] = useState(false);
  const [FormData,setFormData] = useState({});
  const [ setUpdateSuccess] = useState(false);
  const dispatch = useDispatch();
  console.log(FormData);

  console.log(file);

  // firebase Storage
  // allow read;
  // allow write: if 
  // request.resource.size < 2 * 1024 * 1024 &&
  // request.resource.contentType.matches('image/.*')
  useEffect(()=> {
    if(file){
      handleFileUpload(file);
    }
  },[file]);

  const handleFileUpload = (file) => {
    const storage = getStorage(app);
    const fileName = new Date().getTime() + file.name;
    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setFilePerc(Math.round(progress));
      },
      (error) => {
        setFileUploadError(true);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) =>
          setFormData({ ...formData, avatar: downloadURL })
        );
      }
    );
  };
  
  const changeHandler = (event) =>{
    setFormData({...FormData, [event.target.id]: event.target.value });
  }

  const submitHandler = async (e) => {
    e.preventDefault();   
     try {
      dispatch(updateUserStart());
      const res = await fetch(`/api/user/update/${currentUser._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success === false) {
        dispatch(updateUserFailure(data.message));
        return;
      }

      dispatch(updateUserSuccess(data));
      setUpdateSuccess(true);
    } catch (error) {
      dispatch(updateUserFailure(error.message));
    }
  };

  const deleteUserHandler = async () => {

    try{
      dispatch(deleteUserStart());
      const res = await fetch(`/api/user/delete/${currentUser._id}`,{
        method: 'DELETE',
      });

      const data = await res.json();
      if(data.success === false){
        dispatch(deleteUserFailure(data.message));
        return;
      }

      dispatch(deleteUserSuccess(data));
    }
    catch(error){
      dispatch(deleteUserFailure(error.message));
    }
  }

  return (
    <div className='p-3 max-w-lg mx-auto'>
      <h1 className='text-3xl font-semibold my-7 text-center'>  
         Profile  
      </h1>
      
      <form onSubmit={submitHandler} className='flex flex-col gap-4'>
        <input onChange={(event)=> setFile(event.target.files[0])} type='file' ref={fileRef} hidden accept='image/*' multiple>

        </input>
        <img onClick={() => fileRef.current.click()} src={FormData.avatar ||currentUser.avatar}
        className='rounded-full w-24 h-24 object-cover cursor-pointer self-center mt-2 mb-6'></img>

          <p className='self-center text-sm font-medium'>
            { 
              fileUploadError ? <span className='text-red-500'>Error Image upload (image must be less then 2 MB)</span> :
              filePercentage>0 && filePercentage < 100 ?
              <span className='text-slate-700'> {`Image uploading ${filePercentage} %`}</span> :
              filePercentage ===100 ? <span className='text-green-700'>
                Image successfully uploaded !
              </span> :
              ""         
            }
          </p>

        <input type='text' 
        placeholder='username' 
        id='username' 
        defaultValue={currentUser.username}
        onChange={changeHandler}
        className='border p-3 rounded-lg'></input>

        <input type='email' 
        placeholder='email'
        id='email' 
        defaultValue={currentUser.email}
         onChange={changeHandler}
         className='border p-3 rounded-lg'></input>

        <input type='password' 
        placeholder='password' 
        id='password' 
        onChange={changeHandler}
        className='border p-3 rounded-lg'></input>

        <button
          disabled={loading}
          className='bg-black text-white rounded-lg p-3 uppercase hover:opacity-95 disabled:opacity-80'
        >
          {loading ? 'Loading...' : 'Update'}
        </button>
      </form>

      <div className='flex justify-between mt-5'>
        <span onClick={deleteUserHandler} className='text-red-600 font-medium cursor-pointer'>Delete account</span>
        
        <span className='text-red-600 font-medium cursor-pointer'>Sign out</span>
      </div>

    </div>
  )
}