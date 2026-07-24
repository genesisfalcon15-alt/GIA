import cloudinary
import cloudinary.uploader
import os

# configuro cloudinary con las variables de entorno
# estas variables viven en el .env y nunca en el código
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)


def upload_file(file_content, folder, filename, resource_type="raw"):
    """
    sube un archivo a cloudinary y devuelve la url publica
    
    file_content: el contenido binario del archivo
    folder: carpeta dentro de cloudinary (ej: "gia/manuals")
    filename: nombre del archivo sin extension
    resource_type: "raw" para pdfs, "image" para imagenes
    """
    result = cloudinary.uploader.upload(
        file_content,
        folder=folder,
        public_id=filename,
        resource_type=resource_type
    )

    # devuelvo solo la url, el resto son detalles internos de cloudinary
    return result["secure_url"]


def delete_file(public_id, resource_type="raw"):
    """
    elimina un archivo de cloudinary por su public_id
    lo usaremos cuando el usuario borre una conversacion
    """
    cloudinary.uploader.destroy(public_id, resource_type=resource_type)